import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { createReadStream } from 'fs';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Files')
@Controller('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/files',
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    }),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  }))
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  async upload(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Query('channelId') channelId?: string,
    @Query('messageId') messageId?: string,
  ) {
    const savedFile = await this.filesService.create(
      file.filename,
      file.originalname,
      file.mimetype,
      file.size,
      `/uploads/files/${file.filename}`,
      req.user.id,
      channelId,
      messageId,
    );

    return {
      id: savedFile._id,
      filename: savedFile.filename,
      originalName: savedFile.originalName,
      mimetype: savedFile.mimetype,
      size: savedFile.size,
      url: savedFile.path,
      fileType: savedFile.fileType,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all uploaded files' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Request() req: any, @Query('limit') limit?: string) {
    return this.filesService.findAll(
      req.user.id,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get('channel/:channelId')
  @ApiOperation({ summary: 'Get files in a channel' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findByChannel(
    @Param('channelId') channelId: string,
    @Query('limit') limit?: string,
  ) {
    return this.filesService.findByChannel(
      channelId,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get('search')
  @ApiOperation({ summary: 'Search files' })
  @ApiQuery({ name: 'q', required: true })
  search(@Query('q') query: string) {
    return this.filesService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file by ID' })
  findOne(@Param('id') id: string) {
    return this.filesService.findOne(id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download file' })
  async download(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.filesService.findOne(id);
    const filePath = join(process.cwd(), file.path);
    const stream = createReadStream(filePath);
    res.set({
      'Content-Type': file.mimetype,
      'Content-Disposition': `attachment; filename="${file.originalName}"`,
    });
    return new StreamableFile(stream);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete file' })
  delete(@Param('id') id: string, @Request() req: any) {
    return this.filesService.delete(id, req.user.id);
  }
}
